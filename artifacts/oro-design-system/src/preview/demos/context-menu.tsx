import {useState} from "react";
import * as C from "../../components/ui/context-menu";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Context Menu" title="Context Menu" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><C.ContextMenu><C.ContextMenuTrigger className="flex border border-dashed rounded-xl h-36 items-center justify-center">Right-click this example</C.ContextMenuTrigger><C.ContextMenuContent><C.ContextMenuLabel>Quotation</C.ContextMenuLabel><C.ContextMenuGroup><C.ContextMenuItem onSelect={()=>setText("Opened preview")}>Open<C.ContextMenuShortcut>Enter</C.ContextMenuShortcut></C.ContextMenuItem><C.ContextMenuItem disabled>Delete</C.ContextMenuItem></C.ContextMenuGroup><C.ContextMenuSeparator/><C.ContextMenuCheckboxItem checked={checked} onCheckedChange={setChecked}>Show details</C.ContextMenuCheckboxItem><C.ContextMenuRadioGroup value={selected} onValueChange={setSelected}><C.ContextMenuRadioItem value="a">All</C.ContextMenuRadioItem><C.ContextMenuRadioItem value="b">Pending</C.ContextMenuRadioItem></C.ContextMenuRadioGroup><C.ContextMenuSub><C.ContextMenuSubTrigger>More</C.ContextMenuSubTrigger><C.ContextMenuPortal><C.ContextMenuSubContent><C.ContextMenuItem>Print preview</C.ContextMenuItem></C.ContextMenuSubContent></C.ContextMenuPortal></C.ContextMenuSub></C.ContextMenuContent></C.ContextMenu></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
