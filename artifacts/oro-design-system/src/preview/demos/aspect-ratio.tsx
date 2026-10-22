import {useState} from "react";
import * as C from "../../components/ui/aspect-ratio";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Aspect Ratio" title="Aspect Ratio" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><div className="max-w-lg"><C.AspectRatio ratio={16/9} className="rounded-xl bg-muted flex items-center justify-center"><img src={import.meta.env.BASE_URL+"oro-logo.png"} alt="ORO AI logo" className="h-4/5 object-contain rounded-xl"/></C.AspectRatio></div></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
