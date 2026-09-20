"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/config";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Search, Eye } from "lucide-react";

export default function ProjectWeeksPage(){

const {accessToken}=useAdminAuth();

const [weeks,setWeeks]=useState<any[]>([]);
const [loading,setLoading]=useState(true);

const [search,setSearch]=useState("");
const [page,setPage]=useState(1);
const limit=8;

const [editing,setEditing]=useState<any>(null);
const [showModal,setShowModal]=useState(false);

const [preview,setPreview]=useState<any>(null);



/* SAFE JSON PARSER */

const safeJSON=(data:any)=>{

if(!data) return [];

if(typeof data==="string"){

try{
return JSON.parse(data);
}catch{
return [];
}

}

return data;

};



/* FETCH */

const fetchWeeks=async()=>{

if(!accessToken) return;

setLoading(true);

try{

const res=await fetch(
`${API_BASE_URL}/admin/project-weeks`,
{
headers:{Authorization:`Bearer ${accessToken}`}
}
);


const json=await res.json();

let rows=json.data||[];

if(search){

rows=rows.filter((w:any)=>
w.title.toLowerCase().includes(search.toLowerCase())
);

}

const start=(page-1)*limit;

setWeeks(rows.slice(start,start+limit));

}catch{

toast.error("Failed to load weeks");

}

setLoading(false);

};


useEffect(()=>{
fetchWeeks();
},[accessToken,page]);



/* SAVE */

const handleSave=async()=>{

try{

await fetch(
`${API_BASE_URL}/admin/project-weeks/${editing.week_number}`,
{
method:"PATCH",
headers:{
Authorization:`Bearer ${accessToken}`,
"Content-Type":"application/json"
},
body:JSON.stringify(editing)
}
);

toast.success("Week updated");

setShowModal(false);
fetchWeeks();

}catch{

toast.error("Update failed");

}

};



return(

<div className="space-y-8">

<div>

<h1 className="text-2xl font-bold">
Project Weeks
</h1>

<p className="text-muted-foreground">
Manage internship weekly curriculum
</p>

</div>



{/* SEARCH */}

<div className="flex gap-3">

<div className="relative w-72">

<Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground"/>

<input
className="pl-10 border rounded-md p-2 w-full"
placeholder="Search week title"
value={search}
onChange={(e)=>setSearch(e.target.value)}
/>

</div>

<Button variant="outline" onClick={fetchWeeks}>
Search
</Button>

</div>



{/* TABLE */}

<Card>

<CardContent className="p-0">

{loading?(
<div className="p-6 text-center text-muted-foreground">
Loading weeks...
</div>
):(


<table className="w-full text-sm">

<thead className="bg-muted">

<tr>
<th className="p-4 text-left">Week</th>
<th className="p-4 text-left">Title</th>
<th className="p-4">Due</th>
<th className="p-4">Score</th>
<th className="p-4 text-center">Actions</th>
</tr>

</thead>

<tbody>

{weeks.map((w)=>(

<tr key={w.week_number} className="border-t">

<td className="p-4 font-medium">
Week {w.week_number}
</td>

<td className="p-4">
{w.title}
</td>

<td className="p-4 text-center">
{w.due_days}
</td>

<td className="p-4 text-center">
{w.max_score}
</td>

<td className="p-4 text-center space-x-4">

{/* <button
className="text-muted-foreground"
onClick={()=>setPreview(w)}
>
<Eye className="w-4 h-4"/>
</button> */}

<button
className="text-primary"
onClick={()=>{

setEditing({...w});
setShowModal(true);

}}
>
Edit
</button>

</td>

</tr>

))}

</tbody>

</table>

)}

</CardContent>

</Card>



{/* PAGINATION */}

<div className="flex justify-between">

<Button
variant="outline"
disabled={page===1}
onClick={()=>setPage((p)=>p-1)}
>
Previous
</Button>

<div className="text-sm text-muted-foreground">
Page {page}
</div>

<Button
variant="outline"
disabled={weeks.length<limit}
onClick={()=>setPage((p)=>p+1)}
>
Next
</Button>

</div>



{/* EDIT MODAL */}

{showModal && editing && (

<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

<div className="bg-card border rounded-lg w-[1200px] max-h-[90vh] overflow-y-auto p-6 space-y-6">

<h2 className="text-lg font-bold">
Edit Week {editing.week_number}
</h2>


<div className="grid grid-cols-2 gap-6">


{/* LEFT SIDE */}

<Card>
<CardContent className="p-6 space-y-4">

<input
className="w-full border p-2 rounded"
value={editing.title}
onChange={(e)=>setEditing({...editing,title:e.target.value})}
/>

<textarea
className="w-full border p-2 rounded"
value={editing.description}
onChange={(e)=>setEditing({...editing,description:e.target.value})}
/>

<textarea
rows={14}
className="w-full border p-2 rounded font-mono"
value={editing.full_description}
onChange={(e)=>setEditing({...editing,full_description:e.target.value})}
/>

<textarea
className="w-full border p-2 rounded"
value={editing.learning_objectives}
onChange={(e)=>setEditing({...editing,learning_objectives:e.target.value})}
/>


<label className="font-medium">Resources JSON</label>

<textarea
rows={6}
className="w-full border rounded-md p-2 font-mono text-sm"
value={
typeof editing.resources==="string"
? editing.resources
: JSON.stringify(editing.resources,null,2)
}
onChange={(e)=>setEditing({...editing,resources:e.target.value})}
/>


<label className="font-medium">Rubric JSON</label>

<textarea
rows={6}
className="w-full border rounded-md p-2 font-mono text-sm"
value={
typeof editing.rubric==="string"
? editing.rubric
: JSON.stringify(editing.rubric,null,2)
}
onChange={(e)=>setEditing({...editing,rubric:e.target.value})}
/>


<select
className="border p-2 rounded"
value={editing.evaluation_type}
onChange={(e)=>setEditing({...editing,evaluation_type:e.target.value})}
>
<option value="rule">Rule</option>
<option value="ai">AI</option>
<option value="hybrid">Hybrid</option>
</select>


<div className="grid grid-cols-2 gap-4">

<input
type="number"
className="border p-2 rounded"
value={editing.due_days}
onChange={(e)=>setEditing({...editing,due_days:e.target.value})}
/>

<input
type="number"
className="border p-2 rounded"
value={editing.max_score}
onChange={(e)=>setEditing({...editing,max_score:e.target.value})}
/>

</div>

</CardContent>
</Card>



{/* RIGHT SIDE PREVIEW */}

<Card>
<CardContent className="p-6 space-y-4">

<h3 className="font-semibold">
Live Preview
</h3>

<div className="border rounded-md p-4 bg-white text-black overflow-auto max-h-[500px]">

<div
dangerouslySetInnerHTML={{
__html: editing.full_description || ""
}}
/>

</div>


<h4 className="font-semibold">Resources</h4>

<ul className="list-disc ml-6">

{safeJSON(editing.resources).map((r:any,i:number)=>(
<li key={i}>{r.title}</li>
))}

</ul>


<h4 className="font-semibold">Rubric</h4>

<ul className="list-disc ml-6">

{safeJSON(editing.rubric).map((r:any,i:number)=>(
<li key={i}>{r}</li>
))}

</ul>

</CardContent>
</Card>


</div>


<div className="flex justify-end gap-3">

<Button
variant="outline"
onClick={()=>setShowModal(false)}
>
Cancel
</Button>

<Button onClick={handleSave}>
Save
</Button>

</div>

</div>

</div>

)}



</div>

);

}