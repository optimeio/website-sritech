import React from 'react';

const Pagination = ({ page, setPage }) => {
  return (
    <div className="flex items-center justify-center gap-3">
      <button onClick={()=>setPage(Math.max(1,page-1))} className="px-3 py-1 bg-white border rounded">Prev</button>
      <div className="px-3 py-1 bg-white border rounded">{page}</div>
      <button onClick={()=>setPage(page+1)} className="px-3 py-1 bg-white border rounded">Next</button>
    </div>
  );
};

export default Pagination;
