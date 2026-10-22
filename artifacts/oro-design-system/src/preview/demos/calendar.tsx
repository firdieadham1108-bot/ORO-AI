import {useState} from "react";
import * as C from "../../components/ui/calendar";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Calendar" title="Calendar" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><><C.Calendar mode="single" selected={date} onSelect={setDate} defaultMonth={new Date(2026,9,1)} className="rounded-xl border w-fit"/><p>{date?date.toLocaleDateString():"Select a date"}</p></></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
