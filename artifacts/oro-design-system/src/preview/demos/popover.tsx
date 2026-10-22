import {useState} from "react";
import * as C from "../../components/ui/popover";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Popover" title="Popover" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><C.Popover><C.PopoverAnchor/><C.PopoverTrigger asChild><Button variant="outline">Open details</Button></C.PopoverTrigger><C.PopoverContent><h2 className="font-semibold">Appointment note</h2><Input aria-label="Note" className="mt-3" placeholder="Add a preview note"/></C.PopoverContent></C.Popover></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
