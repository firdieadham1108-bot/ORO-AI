import { Toaster } from "../../components/ui/sonner";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";
import { Title } from "../foundations";
export default function Demo(){return <><Title eyebrow="Feedback / Sonner" title="Stacked notifications" sub="Source Sonner wrapper, using the preview theme provider. Notifications are closed until triggered."/><div className="ds-panel flex flex-wrap gap-3"><Button onClick={()=>toast.success("Preview approval complete")}>Success</Button><Button variant="outline" onClick={()=>toast("Availability re-checked",{description:"Example only",action:{label:"Dismiss",onClick:()=>{}}})}>With action</Button><Button variant="destructive" onClick={()=>toast.error("Preview scheduling conflict")}>Error</Button></div><Toaster/></>}
