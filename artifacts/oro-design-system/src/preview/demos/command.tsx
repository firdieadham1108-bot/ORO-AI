import {useState} from "react";
import * as C from "../../components/ui/command";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Command" title="Command" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><C.Command className="border rounded-xl max-w-md"><C.CommandInput placeholder="Search pages…"/><C.CommandList><C.CommandEmpty>No results found.</C.CommandEmpty><C.CommandGroup heading="Pages"><C.CommandItem onSelect={()=>setText("Dashboard selected")}>Dashboard<C.CommandShortcut>⌘1</C.CommandShortcut></C.CommandItem><C.CommandItem onSelect={()=>setText("Schedule selected")}>Staff schedule</C.CommandItem><C.CommandItem disabled>Unavailable action</C.CommandItem></C.CommandGroup><C.CommandSeparator/><C.CommandGroup heading="Tools"><C.CommandItem>Activity log</C.CommandItem></C.CommandGroup></C.CommandList></C.Command></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
