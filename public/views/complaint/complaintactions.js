

  document.querySelectorAll('.btn-primary').forEach(item => {
    item.addEventListener('click', async event => {

        console.log(event.target.id);
          var $value = event.target.id;
        event.preventDefault();
        const complaintid = {
            complaint_id: $value
        }
        console.log(complaintid);
        try {
            await fetch('/resolvecomplaint', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                redirect: 'follow',
                body: JSON.stringify(complaintid)
    
            })
        } catch (error) {
            alert(error.message)
            console.error(error)
        }
        location.reload()
   
     })
   })

