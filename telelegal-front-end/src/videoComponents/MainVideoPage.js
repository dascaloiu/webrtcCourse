import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import "./VideoComponents.css";
import CallInfo from "./CallInfo";
import ChatWindow from "./ChatWindow";
import ActionButtons from "./ActionButtons";
import addStream from "../redux-elements/actions/addStream";
import { useDispatch, useSelector } from "react-redux";
import createPeerConnection from "../webRTCutilities/createPeerConnection";
import socketConnection from "../webRTCutilities/socketConnection";
import updateCallStatus from "../redux-elements/actions/updateCallStatus";

const MainVideoPage = () => {
  const dispatch = useDispatch();
  const callStatus = useSelector((state) => state.callStatus);
  console.log(callStatus);
  const streams = useSelector((state) => state.streams);
  //get query string finder hook
  const [searchParams, setSearchParams] = useSearchParams();
  const [apptInfo, setApptInfo] = useState({});
  const smallFeedEl = useRef(null); //this is a React ref to a DOM element, so we can interact with it the React way
  const largeFeedEl = useRef(null);

  useEffect(() => {
    //fetch the user media
    const fetchMedia = async () => {
      const constraints = {
        video: true, //must have one constraint, just don't show it yet
        audio: true, //if you make a video chat app that doesn't use audio, but does (????), then init this as false and add logic later ... hahaha
      };
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        dispatch(updateCallStatus("haveMedia", true)); //update our callStatus reducer to know that we have the media
        //dispatch will send this fn to the Redux dispatcher so all reducers are notified
        //we send 2 args, the who, and the stream
        dispatch(addStream("localStream", stream));
        const { peerConnection, remoteStream } = await createPeerConnection();
        //we don't know 'who' we are talking to... yet.
        dispatch(addStream("remote1", remoteStream, peerConnection));
        //we have a peerconnection... let's make an offer!
        //EXCEPT, it's not time yet.
        //SDP = information about the feed, and we have NO tracks
        //socket.emit...
      } catch (err) {
        console.log(err);
      }
    };
    fetchMedia();
  }, []);

  useEffect(() => {
    const createOfferAsync = async () => {
      //we have audio and video and we need an offer. Let's make it!
      for (const s in streams) {
        if (s !== "localStream") {
          try {
            const pc = streams[s].peerConnection;
            const offer = await pc.createOffer();
            pc.setLocalDescription(offer);
            //get the token from the url for the socket connection
            const token = searchParams.get("token");
            //get the socket from socketConnection
            const socket = socketConnection(token);
            socket.emit("newOffer", { offer, apptInfo });
          } catch (err) {
            console.log(err);
          }
        }
      }
      dispatch(updateCallStatus("haveCreatedOffer", true));
    };

    if (
      callStatus.audio === "enabled" &&
      callStatus.video === "enabled" &&
      !callStatus.haveCreatedOffer
    ) {
      createOfferAsync();
    }
  }, [callStatus.audio, callStatus.video, callStatus.haveCreatedOffer]);

  useEffect(() => {
    //grab the token var out of the query string
    const token = searchParams.get("token");
    console.log(token);
    const fetchDecodedToken = async () => {
      const resp = await axios.post("https://localhost:9000/validate-link", {
        token,
      });
      console.log(resp.data);
      setApptInfo(resp.data);
    };
    fetchDecodedToken();
  }, []);

  return (
    <div className="main-video-page">
      <div className="video-chat-wrapper">
        {/* //div to hold our remote video, our local video, and our chat window */}
        <video
          id="large-feed"
          ref={largeFeedEl}
          autoPlay
          controls
          playsInline
        ></video>
        <video
          id="own-feed"
          ref={smallFeedEl}
          autoPlay
          controls
          playsInline
        ></video>
        {apptInfo.professionalsFullName ? (
          <CallInfo apptInfo={apptInfo} />
        ) : (
          <></>
        )}
        <ChatWindow />
      </div>
      <ActionButtons smallFeedlEl={smallFeedEl} />
    </div>
  );
};

export default MainVideoPage;
