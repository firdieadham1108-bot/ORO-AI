import {useState} from "react";
import * as C from "../../components/ui/drawer";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Drawer" title="Drawer" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><C.Drawer><C.DrawerTrigger asChild><Button>Open drawer</Button></C.DrawerTrigger><C.DrawerContent><div className="mx-auto max-w-lg p-4"><C.DrawerHeader><C.DrawerTitle>Choose a date</C.DrawerTitle><C.DrawerDescription>Example bottom drawer.</C.DrawerDescription></C.DrawerHeader><C.DrawerFooter><C.DrawerClose asChild><Button>Done</Button></C.DrawerClose></C.DrawerFooter></div></C.DrawerContent></C.Drawer></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
