import {useState} from "react";
import * as C from "../../components/ui/input";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Input" title="Input" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><div className="max-w-md grid gap-4"><C.Input aria-label="Customer name" placeholder="Customer name" value={text} onChange={e=>setText(e.target.value)}/><C.Input aria-label="Invalid example" aria-invalid="true" defaultValue="Needs review"/><C.Input aria-label="Disabled example" placeholder="Disabled input" disabled/><C.Input aria-label="Read only example" defaultValue="Read-only value" readOnly/></div></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
