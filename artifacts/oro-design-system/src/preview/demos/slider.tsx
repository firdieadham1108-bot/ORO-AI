import {useState} from "react";
import * as C from "../../components/ui/slider";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Slider" title="Slider" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><div className="grid gap-6 max-w-md"><C.Slider value={[count]} onValueChange={v=>setCount(v[0])} max={100} aria-label="Preview amount"/><p>{count}</p><C.Slider defaultValue={[30,70]} aria-label="Preview range"/><C.Slider defaultValue={[50]} disabled aria-label="Disabled slider"/></div></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
