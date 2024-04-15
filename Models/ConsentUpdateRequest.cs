using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CadetTest.Models
{
	public class ConsentUpdateRequest
	{	
			public int Id { get; set; }
			public string Type { get; set; }
			public string Recipient { get; set; }
			public string Status { get; set; }
			public string RecipientType { get; set; }
	}
}
