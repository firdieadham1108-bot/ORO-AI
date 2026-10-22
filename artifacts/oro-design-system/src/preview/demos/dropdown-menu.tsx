import {useState} from "react";
import * as C from "../../components/ui/dropdown-menu";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Dropdown Menu" title="Dropdown Menu" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><C.DropdownMenu><C.DropdownMenuTrigger asChild><Button variant="outline">Quotation actions</Button></C.DropdownMenuTrigger><C.DropdownMenuContent><C.DropdownMenuLabel>Quotation</C.DropdownMenuLabel><C.DropdownMenuGroup><C.DropdownMenuItem onSelect={()=>setText("Open selected")}>Open<C.DropdownMenuShortcut>Enter</C.DropdownMenuShortcut></C.DropdownMenuItem><C.DropdownMenuItem disabled>Delete</C.DropdownMenuItem></C.DropdownMenuGroup><C.DropdownMenuSeparator/><C.DropdownMenuCheckboxItem checked={checked} onCheckedChange={setChecked}>Show details</C.DropdownMenuCheckboxItem><C.DropdownMenuRadioGroup value={selected} onValueChange={setSelected}><C.DropdownMenuRadioItem value="a">All</C.DropdownMenuRadioItem><C.DropdownMenuRadioItem value="b">Pending</C.DropdownMenuRadioItem></C.DropdownMenuRadioGroup><C.DropdownMenuSub><C.DropdownMenuSubTrigger>Export</C.DropdownMenuSubTrigger><C.DropdownMenuPortal><C.DropdownMenuSubContent><C.DropdownMenuItem>Print preview</C.DropdownMenuItem></C.DropdownMenuSubContent></C.DropdownMenuPortal></C.DropdownMenuSub></C.DropdownMenuContent></C.DropdownMenu></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
