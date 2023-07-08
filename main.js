let localStream;
let remoteStream;
let peerConnection;

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

  let offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  console.log('Offer:');
  console.log(offer);
};

init();
