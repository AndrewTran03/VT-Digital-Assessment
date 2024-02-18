import React from "react";
import { CanvasUserInfoObj } from "../types";

type CanvasUserInfoType = {
  canvasUserInfo: CanvasUserInfoObj;
  setCanvasUserInfo: React.Dispatch<React.SetStateAction<CanvasUserInfoObj>>;
};

const CanvasUserInfoContext = React.createContext<CanvasUserInfoType>({
  canvasUserInfo: {
    canvasUserId: 0
  },
  setCanvasUserInfo: () => {}
});

export default CanvasUserInfoContext;
