import {useState} from "react";
import * as C from "../../components/ui/sheet";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Sheet" title="Sheet" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><div className="flex flex-wrap gap-3">{(["left","right","top","bottom"] as const).map(side=><C.Sheet key={side}><C.SheetTrigger asChild><Button variant="outline">Open {side}</Button></C.SheetTrigger><C.SheetContent side={side}><C.SheetHeader><C.SheetTitle>Preview sheet</C.SheetTitle><C.SheetDescription>No app state is changed.</C.SheetDescription></C.SheetHeader><C.SheetFooter><C.SheetClose asChild><Button>Close</Button></C.SheetClose></C.SheetFooter></C.SheetContent></C.Sheet>)}</div></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
