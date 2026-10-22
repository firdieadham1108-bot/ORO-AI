import {useState} from "react";
import * as C from "../../components/ui/checkbox";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Checkbox" title="Checkbox" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><div className="grid gap-5"><label className="flex gap-3 items-center"><C.Checkbox checked={checked} onCheckedChange={v=>setChecked(v===true)}/>Confirm availability</label><label className="flex gap-3 items-center"><C.Checkbox checked="indeterminate"/>Indeterminate</label><label className="flex gap-3 items-center"><C.Checkbox disabled/>Disabled</label></div></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
