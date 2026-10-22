import {useState} from "react";
import * as C from "../../components/ui/toggle";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Toggle" title="Toggle" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><div className="flex gap-4 flex-wrap">{(["default","outline"] as const).map(variant=><C.Toggle key={variant} variant={variant} pressed={checked} onPressedChange={setChecked}>Details</C.Toggle>)}<C.Toggle size="sm">Small</C.Toggle><C.Toggle size="lg">Large</C.Toggle><C.Toggle disabled>Disabled</C.Toggle></div></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
