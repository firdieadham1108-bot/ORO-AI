import {useState} from "react";
import * as C from "../../components/ui/skeleton";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Skeleton" title="Skeleton" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><div className="flex items-center gap-5"><C.Skeleton className="h-12 w-12 rounded-full"/><div className="space-y-3 flex-1"><C.Skeleton className="h-4 w-3/4"/><C.Skeleton className="h-4 w-1/2"/></div></div></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
