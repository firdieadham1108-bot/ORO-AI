import {useState} from "react";
import * as C from "../../components/ui/select";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Select" title="Select" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><div className="flex gap-4 flex-wrap"><C.Select value={selected} onValueChange={setSelected}><C.SelectTrigger className="w-56"><C.SelectValue placeholder="Choose status"/></C.SelectTrigger><C.SelectContent><C.SelectGroup><C.SelectLabel>Status</C.SelectLabel><C.SelectItem value="a">All quotations</C.SelectItem><C.SelectItem value="b">Pending approval</C.SelectItem><C.SelectSeparator/><C.SelectItem value="c" disabled>Unavailable</C.SelectItem></C.SelectGroup></C.SelectContent></C.Select><C.Select disabled><C.SelectTrigger className="w-48"><C.SelectValue placeholder="Disabled"/></C.SelectTrigger></C.Select></div></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
