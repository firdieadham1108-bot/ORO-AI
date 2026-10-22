import {useState} from "react";
import * as C from "../../components/ui/input-otp";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Input Otp" title="Input Otp" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><C.InputOTP maxLength={6} value={text} onChange={setText} aria-label="Example verification code"><C.InputOTPGroup>{[0,1,2].map(i=><C.InputOTPSlot index={i} key={i}/>)}</C.InputOTPGroup><C.InputOTPSeparator/><C.InputOTPGroup>{[3,4,5].map(i=><C.InputOTPSlot index={i} key={i}/>)}</C.InputOTPGroup></C.InputOTP></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
