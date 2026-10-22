import {useState} from "react";
import * as C from "../../components/ui/navigation-menu";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Navigation Menu" title="Navigation Menu" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><C.NavigationMenu><C.NavigationMenuList><C.NavigationMenuItem><C.NavigationMenuTrigger>Workspace</C.NavigationMenuTrigger><C.NavigationMenuContent><div className="p-5 w-64"><C.NavigationMenuLink href="#page=overview">Overview</C.NavigationMenuLink><p className="text-sm text-muted-foreground mt-2">A local preview link.</p></div></C.NavigationMenuContent></C.NavigationMenuItem><C.NavigationMenuItem><C.NavigationMenuLink className={C.navigationMenuTriggerStyle()} href="#page=colors">Colors</C.NavigationMenuLink></C.NavigationMenuItem></C.NavigationMenuList></C.NavigationMenu></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
