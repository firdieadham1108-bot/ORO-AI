import {useState} from "react";
import * as C from "../../components/ui/menubar";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Menubar" title="Menubar" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><C.Menubar><C.MenubarMenu><C.MenubarTrigger>File</C.MenubarTrigger><C.MenubarContent><C.MenubarLabel>Quotation</C.MenubarLabel><C.MenubarGroup><C.MenubarItem onSelect={()=>setText("New selected")}>New<C.MenubarShortcut>⌘N</C.MenubarShortcut></C.MenubarItem><C.MenubarItem disabled>Delete</C.MenubarItem></C.MenubarGroup><C.MenubarSeparator/><C.MenubarCheckboxItem checked={checked} onCheckedChange={setChecked}>Show details</C.MenubarCheckboxItem><C.MenubarRadioGroup value={selected} onValueChange={setSelected}><C.MenubarRadioItem value="a">Compact</C.MenubarRadioItem><C.MenubarRadioItem value="b">Comfortable</C.MenubarRadioItem></C.MenubarRadioGroup><C.MenubarSub><C.MenubarSubTrigger>Export</C.MenubarSubTrigger><C.MenubarPortal><C.MenubarSubContent><C.MenubarItem>Print preview</C.MenubarItem></C.MenubarSubContent></C.MenubarPortal></C.MenubarSub></C.MenubarContent></C.MenubarMenu></C.Menubar></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
