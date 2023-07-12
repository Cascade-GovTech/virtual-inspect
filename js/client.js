let socketConnected;
let username;
let remoteUser;

let localStream;
let remoteStream;
let peerConnection;

const socket = new WebSocket('ws://0.0.0.0:8080');

const servers = {
  iceServers: [{
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
  }],
};

async function handleJoinRoom(e) {
  e.preventDefault();
  username = document.getElementById('roomName').value;
  localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: false})
  document.getElementById('host').srcObject = localStream;
  send({type: 'join'});
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('videos').style.display = '';
}

function send(message) {
  if (username) {
    message.name = username;
  }
  socket.send(JSON.stringify(message));
}

const createPeerConnection = async () => {
  peerConnection = new RTCPeerConnection(servers);
  remoteStream = new MediaStream();

  document.getElementById('guest').srcObject = remoteStream;

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = (e) => {
    e.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  }

  peerConnection.onicecandidate = async (e) => {
    if (e.candidate) {
      console.log('New ICE candidate: ', event.candidate);
      send({ type: 'candidate', candidate: event.candidate });
    }
  }
};

async function createOffer(success) {
  if (!success) {
    alert('Unable to create offer');
    return;
  }
  await createPeerConnection();
  await peerConnection.createOffer((offer) => {
    peerConnection.setLocalDescription(offer);

    console.log('Offer:');
    console.log(offer);

    send({ type: 'offer', offer: offer });
  });
}

async function handleOffer(offer, name) {
  await createPeerConnection();
  await peerConnection.setRemoteDescription(offer);

  console.log('received offer')

  //create an answer to an offer
  await peerConnection.createAnswer((answer) => {
    peerConnection.setLocalDescription(answer);

    console.log('Answer:');
    console.log(answer);

    send({
      type: "answer",
      answer: answer
    });

  }, (error) => {
    alert("Error when creating an answer");
  });
}

function handleAnswer(answer) {
  peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  console.log('Answer:');
  console.log(answer);
}

function handleCandidate(candidate) {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  console.log('received ice candidate')
}

function handleLeave() {

  peerConnection.close();
  peerConnection.onicecandidate = null;
  peerConnection.onaddstream = null;
};

socket.addEventListener('open', () => {
  console.log('WS connection established');
  socketConnected = true;
  socket.send(JSON.stringify({
    type: 'status',
    message: 'Confirmed connection',
  }));
})

socket.addEventListener('message', ({ data }) => {
  const jsonData = JSON.parse(data);

  switch (jsonData.type) {
    case 'create':
      createOffer(jsonData.success);
      break;
    case 'offer':
      handleOffer(jsonData.offer, jsonData.name);
      break;
    case 'answer':
      handleAnswer(jsonData.answer);
      break;
    case 'candidate':
      handleCandidate(jsonData.candidate);
      break;
    case 'leave':
      handleLeave();
      break;
    default:
      break;
  }
});

socket.addEventListener('error', (err) => {
  console.log(err);
});

socket.addEventListener('close', () => {
  console.log('WS disconnected');
  socketConnected = false;
  socket.close();
});
