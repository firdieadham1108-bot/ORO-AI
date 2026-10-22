import {useState} from "react";
import * as C from "../../components/ui/alert";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Alert" title="Alert" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><><C.Alert><C.AlertTitle>Availability checked</C.AlertTitle><C.AlertDescription>The crew is free on the requested date.</C.AlertDescription></C.Alert><C.Alert variant="destructive"><C.AlertTitle>Scheduling conflict</C.AlertTitle><C.AlertDescription>Choose a different date before confirming.</C.AlertDescription></C.Alert></></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
