"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/config";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";

export default function CollegesPage() {

  const { accessToken } = useAdminAuth();

  const [colleges,setColleges] = useState<any[]>([]);
  const [loading,setLoading] = useState(true);

  const [search,setSearch] = useState("");
  const [page,setPage] = useState(1);
  const limit = 8;

  const [showModal,setShowModal] = useState(false);
  const [viewModal,setViewModal] = useState(false);

  const [editing,setEditing] = useState<any>(null);

  const emptyCollege = {
    university_id:"",
    name:"",
    genders_accepted:"",
    campus_size:"",
    established_year:"",
    rating:"",
    courses:"",
    city:"",
    state:"",
    country:"",
    college_type:""
  };

  const [form,setForm] = useState<any>(emptyCollege);

  /* ================= FETCH ================= */

  const fetchColleges = async () => {

    if(!accessToken) return;

    setLoading(true);

    try{

      const res = await fetch(
        `${API_BASE_URL}/admin/colleges?search=${search}&page=${page}&limit=${limit}`,
        {
          headers:{Authorization:`Bearer ${accessToken}`}
        }
      );

      const json = await res.json();

      setColleges(json.data?.rows || []);

    }catch{
      toast.error("Failed to load colleges");
    }

    setLoading(false);
  };

  useEffect(()=>{
    fetchColleges();
  },[accessToken,page]);

  /* ================= VALIDATION ================= */

  const validateForm = () => {

    if(!form.name.trim()){
      toast.error("College name required");
      return false;
    }

    if(!form.city.trim()){
      toast.error("City required");
      return false;
    }

    return true;
  };

  /* ================= SAVE ================= */

  const handleSave = async () => {

    if(!validateForm()) return;

    try{

      if(editing){

        await fetch(`${API_BASE_URL}/admin/colleges/${editing.id}`,{
          method:"PATCH",
          headers:{
            Authorization:`Bearer ${accessToken}`,
            "Content-Type":"application/json"
          },
          body:JSON.stringify(form)
        });

        toast.success("College updated");

      }else{

        await fetch(`${API_BASE_URL}/admin/colleges`,{
          method:"POST",
          headers:{
            Authorization:`Bearer ${accessToken}`,
            "Content-Type":"application/json"
          },
          body:JSON.stringify(form)
        });

        toast.success("College created");
      }

      setShowModal(false);
      setEditing(null);
      setForm(emptyCollege);

      fetchColleges();

    }catch{
      toast.error("Save failed");
    }
  };

  /* ================= UI ================= */

  return(

  <div className="space-y-8">

  {/* HEADER */}

  <div className="flex justify-between items-center">

  <div>
  <h1 className="text-2xl font-bold">Colleges</h1>
  <p className="text-muted-foreground">
  Manage partner colleges
  </p>
  </div>

  <Button
  onClick={()=>{
  setEditing(null);
  setForm(emptyCollege);
  setShowModal(true);
  }}
  >
  <Plus className="w-4 h-4 mr-2"/>
  Add College
  </Button>

  </div>

  {/* SEARCH */}

  <div className="flex gap-3">

  <div className="relative w-72">

  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground"/>

  <input
  placeholder="Search colleges..."
  className="pl-10 border rounded-md p-2 w-full"
  value={search}
  onChange={(e)=>setSearch(e.target.value)}
  />

  </div>

  <Button variant="outline" onClick={fetchColleges}>
  Search
  </Button>

  </div>

  {/* TABLE */}

  <Card>

  <CardContent className="p-0">

  {loading ?(

  <div className="p-6 text-center">
  Loading colleges...
  </div>

  ):(

  <table className="w-full text-sm">

  <thead className="bg-muted">

  <tr>
  <th className="p-4 text-left">College</th>
  <th className="p-4 text-left">University</th>
  <th className="p-4 text-left">City</th>
  <th className="p-4 text-center">Actions</th>
  </tr>

  </thead>

  <tbody>

  {colleges.map((c)=>(
  <tr key={c.id} className="border-t hover:bg-muted/40">

  <td className="p-4 font-medium">
  {c.name}
  </td>

  <td className="p-4 text-muted-foreground">
  {c.university_name}
  </td>

  <td className="p-4">
  {c.city}
  </td>

  <td className="p-4 text-center space-x-3">

  <button
  className="text-muted-foreground"
  onClick={()=>{
  setEditing(c);
  setViewModal(true);
  }}
  >
  View
  </button>

  <button
  className="text-primary"
  onClick={()=>{
  setEditing(c);
  setForm(c);
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

  <div className="flex justify-between items-center">

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
  disabled={colleges.length < limit}
  onClick={()=>setPage((p)=>p+1)}
  >
  Next
  </Button>

  </div>

  {/* CREATE / EDIT MODAL */}

  {showModal &&(

  <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

  <div className="bg-card border rounded-lg w-[650px] p-6 space-y-4 max-h-[90vh] overflow-y-auto">

  <h2 className="text-lg font-bold">
  {editing ? "Edit College" : "Create College"}
  </h2>

  <input placeholder="University ID"
  className="w-full border p-2 rounded"
  value={form.university_id}
  onChange={(e)=>setForm({...form,university_id:e.target.value})}
/>

  <input placeholder="College Name"
  className="w-full border p-2 rounded"
  value={form.name}
  onChange={(e)=>setForm({...form,name:e.target.value})}
/>

  <input placeholder="Gender Accepted"
  className="w-full border p-2 rounded"
  value={form.genders_accepted}
  onChange={(e)=>setForm({...form,genders_accepted:e.target.value})}
/>

  <input placeholder="Campus Size"
  className="w-full border p-2 rounded"
  value={form.campus_size}
  onChange={(e)=>setForm({...form,campus_size:e.target.value})}
/>

  <input placeholder="Established Year"
  className="w-full border p-2 rounded"
  value={form.established_year}
  onChange={(e)=>setForm({...form,established_year:e.target.value})}
/>

  <input placeholder="Rating"
  className="w-full border p-2 rounded"
  value={form.rating}
  onChange={(e)=>setForm({...form,rating:e.target.value})}
/>

  <textarea
  rows={4}
  placeholder="Courses"
  className="w-full border rounded-md p-2"
  value={form.courses}
  onChange={(e)=>setForm({...form,courses:e.target.value})}
/>

  <input placeholder="City"
  className="w-full border p-2 rounded"
  value={form.city}
  onChange={(e)=>setForm({...form,city:e.target.value})}
/>

  <input placeholder="State"
  className="w-full border p-2 rounded"
  value={form.state}
  onChange={(e)=>setForm({...form,state:e.target.value})}
/>

  <input placeholder="Country"
  className="w-full border p-2 rounded"
  value={form.country}
  onChange={(e)=>setForm({...form,country:e.target.value})}
/>

  <input placeholder="College Type"
  className="w-full border p-2 rounded"
  value={form.college_type}
  onChange={(e)=>setForm({...form,college_type:e.target.value})}
/>

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

  {/* VIEW MODAL */}

  {viewModal && editing &&(

  <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

  <div className="bg-card border rounded-lg w-[700px] p-6 space-y-4 max-h-[90vh] overflow-y-auto">

  <h2 className="text-xl font-bold">
  {editing.name}
  </h2>

  <div className="grid grid-cols-2 gap-4 text-sm">

  <div>
  <label className="text-muted-foreground">University</label>
  <div>{editing.university_name}</div>
  </div>

  <div>
  <label className="text-muted-foreground">Gender</label>
  <div>{editing.genders_accepted}</div>
  </div>

  <div>
  <label className="text-muted-foreground">Campus Size</label>
  <div>{editing.campus_size}</div>
  </div>

  <div>
  <label className="text-muted-foreground">Established</label>
  <div>{editing.established_year}</div>
  </div>

  <div>
  <label className="text-muted-foreground">Rating</label>
  <div>{editing.rating}</div>
  </div>

  <div>
  <label className="text-muted-foreground">City</label>
  <div>{editing.city}</div>
  </div>

  <div>
  <label className="text-muted-foreground">State</label>
  <div>{editing.state}</div>
  </div>

  <div>
  <label className="text-muted-foreground">Country</label>
  <div>{editing.country}</div>
  </div>

  <div>
  <label className="text-muted-foreground">Type</label>
  <div>{editing.college_type}</div>
  </div>

  </div>

  <div>

  <label className="text-muted-foreground">
  Courses
  </label>

  <div className="border p-3 rounded max-h-40 overflow-y-auto text-sm">
  {editing.courses}
  </div>

  </div>

  <div className="flex justify-end">
  <Button onClick={()=>setViewModal(false)}>
  Close
  </Button>
  </div>

  </div>

  </div>

  )}

  </div>

  );
}