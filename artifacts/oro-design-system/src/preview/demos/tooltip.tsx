import {useState} from "react";
import * as C from "../../components/ui/tooltip";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Tooltip" title="Tooltip" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><C.TooltipProvider delayDuration={150}><C.Tooltip><C.TooltipTrigger asChild><Button variant="outline">Hover or focus me</Button></C.TooltipTrigger><C.TooltipContent>The date is re-checked before approval.</C.TooltipContent></C.Tooltip></C.TooltipProvider></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
