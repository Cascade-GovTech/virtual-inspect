let localStream;
let remoteStream;
let peerConnection;

const socket = new WebSocket('ws://0.0.0.0:8080');

socket.addEventListener('open', () => {
    console.log('WS connection established');
    socketConnected = true;
    socket.send(JSON.stringify({
        message: 'Confirmed connection'
    }));
})

socket.addEventListener('message', ({ data }) => {
    const packet = JSON.parse(data);
    console.log(packet);
});

socket.addEventListener('close', () => {
    console.log('WS disconnected');
    socketConnected = false;
    socket.close();
});





const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
};

const init = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  document.getElementById('user-1').srcObject = localStream;
  createOffer();
};

const createOffer = async () => {
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
    }
  }
  let offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  console.log('Offer:');
  console.log(offer);
};

init();
