import { useState, useEffect } from "react";

type Props = {
  num: number;
  name: string;
};

const Test: React.FC<Props> = (props) => {
  const [num, setNum] = useState(props.num);

  useEffect(() => {
    console.log(num);
  }, [num]);

  return (
    <>
      Num is {num}
      <p>Hi, this is a test!</p>
      <button onClick={() => setNum((prevNum) => prevNum + 1)}>Click Me!</button>
    </>
  );
};

export default Test;
