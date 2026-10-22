import { useState } from "react";
import { useForm } from "react-hook-form";
import * as C from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Title } from "../foundations";
export default function Demo(){
 const form=useForm<{name:string}>({defaultValues:{name:""}});
 const [saved,setSaved]=useState("");
 return <><Title eyebrow="Forms / Form" title="Validated form" sub="The source React Hook Form context, field bindings, descriptions and accessible errors."/><div className="ds-panel max-w-lg"><C.Form {...form}><form className="space-y-5" onSubmit={form.handleSubmit(v=>setSaved(v.name))}><C.FormField control={form.control} name="name" rules={{required:"Enter a name before continuing."}} render={({field})=><C.FormItem><C.FormLabel>Customer name</C.FormLabel><C.FormControl><Input placeholder="Enter a preview name" {...field}/></C.FormControl><C.FormDescription>Preview only. No data is saved to the application.</C.FormDescription><C.FormMessage/></C.FormItem>}/><Button type="submit">Validate preview</Button></form></C.Form><p role="status" className="mt-4 text-sm">{saved&&`Valid: ${saved}`}</p></div></>;
}
