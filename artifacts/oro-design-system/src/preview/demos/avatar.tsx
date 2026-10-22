import {useState} from "react";
import * as C from "../../components/ui/avatar";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Avatar" title="Avatar" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><div className="flex gap-4"><C.Avatar><C.AvatarImage src={import.meta.env.BASE_URL+"oro-logo.png"} alt="ORO AI"/><C.AvatarFallback>OR</C.AvatarFallback></C.Avatar><C.Avatar><C.AvatarFallback>FM</C.AvatarFallback></C.Avatar></div></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
