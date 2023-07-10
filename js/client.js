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

function send(message) {
  if (username) {
    message.name = username;
  }
  socket.send(JSON.stringify(message));
}

const createOffer = async (success) => {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  if (!success) {
    alert('Unable to create offer');
    return;
  }
  peerConnection = new RTCPeerConnection(servers);
  remoteStream = new MediaStream();

  document.getElementById('user-2').srcObject = remoteStream;

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
  let offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  console.log('Offer:');
  console.log(offer);
};

socket.addEventListener('open', () => {
  console.log('WS connection established');
  socketConnected = true;
  socket.send(JSON.stringify({
    message: 'Confirmed connection'
  }));
})

socket.addEventListener('message', ({ data }) => {
  console.log(data)
  const packet = JSON.parse(data);
  console.log(packet);

  switch (packet.type) {
    case 'login':
      createOffer(data.success);
      break;
    case 'offer':
      handleOffer(data.offer, data.name);
      break;
    case 'answer':
      handleAnswer(data.answer);
      break;
    case 'candidate':
      handleCandidate(data.candidate);
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

createOffer(true)
