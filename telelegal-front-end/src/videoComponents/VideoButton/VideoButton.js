import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import startLocalVideoStream from "./startLocalVideoStream";
import updateCallStatus from "../../redux-elements/actions/updateCallStatus";
import getDevices from "../../webRTCutilities/getDevices";
import addStream from "../../redux-elements/actions/addStream";
import ActionButtonCaretDropDown from "../ActionButtonCaretDropDown";

const VideoButton = ({ smallFeedEl }) => {
  const dispatch = useDispatch();
  const callStatus = useSelector((state) => state.callStatus);
  const streams = useSelector((state) => state.streams);
  const [pendingUpdate, setPendingUpdate] = useState(false);
  const [caretOpen, setCaretOpen] = useState(false);
  const [videoDeviceList, setVideoDeviceList] = useState([]);

  const DropDown = () => {};

  useEffect(() => {
    const getDevicesAsync = async () => {
      if (caretOpen) {
        //then we need to check for video devices
        const devices = await getDevices();
        console.log(devices.videoDevices);
        setVideoDeviceList(devices.videoDevices);
      }
    };
    getDevicesAsync();
  }, [caretOpen]);

  const changeVideoDevice = async (e) => {
    //the user changed the desired video device
    //1. we need to get that deviceId
    const deviceId = e.target.value;
    console.log(deviceId);
    //2. we need to getUserMedia (permission)
    const newConstraints = {
      audio:
        callStatus.audioDevice === "default"
          ? true
          : { deviceId: { exact: deviceId } },
      video: { deviceId: { exact: deviceId } },
    };
    const stream = await navigator.mediaDevices.getUserMedia(newConstraints);
    //3. update Redux with that videoDevice, and that video is enabled
    dispatch(updateCallStatus("videoDevice", deviceId));
    dispatch(updateCallStatus("video", "enabled"));
    //4. update the smallFeedEl
    smallFeedEl.current.srcObject = stream;
    //5. we need to update the localStream in streams
    dispatch(addStream("localStream", stream));
    //6. add tracks
    const tracks = stream.getVideoTracks();
    //come back to this later
    //if we stop the old tracks, and add new tracks, that will mean
    //...renegotiation
  };

  const startStopVideo = () => {
    // console.log("Sanity Check");
    //first, check if the video is enabled, if so disable
    if (callStatus.video === "enabled") {
      //update redux callStatus
      dispatch(updateCallStatus("video", "disabled"));
      //set the stream to disabled
      const tracks = streams.localStream.stream.getVideoTracks();
      tracks.forEach((t) => {
        t.enabled = false;
      });
    } else if (callStatus.video === "disabled") {
      //second, check if the video is disabled, if so enable
      //update redux callStatus
      dispatch(updateCallStatus("video", "enabled"));
      const tracks = streams.localStream.stream.getVideoTracks();
      tracks.forEach((t) => {
        t.enabled = true;
      });
    } else if (callStatus.haveMedia) {
      //thirdly, check to see if we have media, if so, start the stream
      //we have the media! show the feed
      smallFeedEl.current.srcObject = streams.localStream.stream;
      //add tracks to the peerConnections
      startLocalVideoStream(streams, dispatch);
    } else {
      //lastly, it is possible, we don't have the media yet, wait for the media, then start the stream
      setPendingUpdate(true);
    }
  };

  useEffect(() => {
    if (pendingUpdate && callStatus.haveMedia) {
      console.log("Pending update succeeded!");
      //this useEffect will run if pendingUpdate changes to true!
      setPendingUpdate(false); //switch back to false
      smallFeedEl.current.srcObject = streams.localStream.stream;
      startLocalVideoStream(streams, dispatch);
    }
  }, [pendingUpdate, callStatus.haveMedia]);

  return (
    <div className="button-wrapper video-button d-inline-block">
      <i
        className="fa fa-caret-up choose-video"
        onClick={() => setCaretOpen(!caretOpen)}
      ></i>
      <div className="button camera" onClick={startStopVideo}>
        <i className="fa fa-video"></i>
        <div className="btn-text">
          {callStatus.video === "enabled" ? "Stop" : "Start"} Video
        </div>
      </div>
      {caretOpen ? (
        <ActionButtonCaretDropDown
          defaultValue={callStatus.videoDevice}
          changeHandler={changeVideoDevice}
          deviceList={videoDeviceList}
          type="video"
        />
      ) : (
        <></>
      )}
    </div>
  );
};

export default VideoButton;
