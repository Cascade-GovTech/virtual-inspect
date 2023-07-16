let socketConnected;
let roomName;

let localStream;
let remoteStream;
let peerConnection;

const socket = new WebSocket(`wss://${window.location.hostname}:5000`);

const servers = {
  iceServers: [{
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
  }],
};

async function handleJoinRoom(e) {
  e.preventDefault();
  roomName = document.getElementById('roomName').value;
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  document.getElementById('host').srcObject = localStream;
  send({type: 'join'});
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('videos').style.display = '';
  document.getElementById('roomName').innerHTML = roomName;
}

function send(message) {
  if (roomName) {
    message.name = roomName;
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
};

async function createOffer(success) {
  if (!success) {
    alert('Unable to create offer');
    return;
  }
  await createPeerConnection();

  peerConnection.onicecandidate = async (e) => {
    if (e.candidate) {
      send({ type: 'hostCandidate', candidate: e.candidate });
      console.log('New ICE candidate sent');
    }
  }

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  send({type: 'offer', offer: offer});

  document.getElementById('status').innerHTML = 'Awaiting guest';
}

async function handleOffer(offer) {
  await createPeerConnection();

  peerConnection.onicecandidate = async (e) => {
    if (e.candidate) {
      send({ type: 'guestCandidate', candidate: e.candidate });
      console.log('New ICE candidate sent');
    }
  }
  document.getElementById('status').innerHTML = 'Joining..';

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

    document.getElementById('status').innerHTML = 'Connected';

  }, (error) => {
    alert("Error when creating an answer");
  });
}

function handleAnswer(answer) {
  peerConnection.setRemoteDescription(answer);
  document.getElementById('status').innerHTML = 'Connected';
}

function handleCandidate(candidate) {
  peerConnection.addIceCandidate(candidate);
  console.log('received ice candidate')
}

function handleLeave() {
  peerConnection.close();
  peerConnection.onicecandidate = null;
  peerConnection.onaddstream = null;
  document.getElementById('status').innerHTML = 'User disconnected';
}

socket.addEventListener('open', () => {
  console.log('WS connection established');
  socketConnected = true;
  socket.send(JSON.stringify({
    type: 'status',
    message: 'Confirmed connection',
  }));
});

socket.addEventListener('message', ({ data }) => {
  const jsonData = JSON.parse(data);

  switch (jsonData.type) {
    case 'create':
      createOffer(jsonData.success);
      break;
    case 'offer':
      handleOffer(jsonData.offer);
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
