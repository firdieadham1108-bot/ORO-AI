import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Title } from "../foundations";
export default function Demo(){
 const [clicks,setClicks]=useState(0);
 return <><Title eyebrow="Components / Actions" title="Button" sub="Ported from the source UI library: Radix Slot, CVA variants, forwarded ref, native button props and disabled behavior."/><div className="ds-panel flex flex-wrap gap-3">{(["default","secondary","outline","ghost","destructive","link"] as const).map(variant=><Button key={variant} variant={variant} onClick={()=>setClicks(n=>n+1)}>{variant}</Button>)}</div><div className="ds-panel flex flex-wrap gap-3"><Button size="sm">Small</Button><Button>Default</Button><Button size="lg">Large</Button><Button size="icon" aria-label="Add"><Plus/></Button><Button disabled>Disabled</Button><Button asChild variant="link"><a href="#page=overview">As a link</a></Button></div><p role="status" className="text-sm text-muted-foreground mt-4">Button clicks: {clicks}</p></>;
}
