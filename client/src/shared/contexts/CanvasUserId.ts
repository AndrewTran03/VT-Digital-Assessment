import React from "react";

type CanvasUserIdType = {
  canvasUserId: number;
  setCanvasUserId: React.Dispatch<React.SetStateAction<number>>;
};

const CanvasUserIdContext = React.createContext<CanvasUserIdType>({ canvasUserId: 0, setCanvasUserId: () => {} });

export default CanvasUserIdContext;
