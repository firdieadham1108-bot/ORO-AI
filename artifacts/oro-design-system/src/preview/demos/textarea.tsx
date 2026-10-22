import {useState} from "react";
import * as C from "../../components/ui/textarea";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Textarea" title="Textarea" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><div className="space-y-4 max-w-lg"><C.Textarea value={text} onChange={e=>setText(e.target.value)} aria-label="Enquiry message" placeholder="Paste the customer enquiry…"/><C.Textarea disabled aria-label="Disabled message" placeholder="Disabled textarea"/><C.Textarea aria-invalid="true" aria-label="Invalid message" defaultValue="Needs clarification"/></div></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
