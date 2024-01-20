import { useState } from "react";

type Props = {
  num: number;
};

function Test(props: Props) {
  const [num, setNum] = useState<number>(0);

  return (
    <div>
      Num is {num}
      <p>Hi, this is a test!</p>
    </div>
  );
}

export default Test;
