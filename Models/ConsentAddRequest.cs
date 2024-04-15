using System.ComponentModel.DataAnnotations;

namespace CadetTest.Models
{
	public class ConsentAddRequest
	{

		[Required(ErrorMessage = "The 'Type' field is required.")]
		public string Type { get; set; }

		[Required(ErrorMessage = "The 'Recipient' field is required.")]
		public string Recipient { get; set; }

		[Required(ErrorMessage = "The 'Status' field is required.")]
		public string Status { get; set; }

		[Required(ErrorMessage = "The 'RecipientType' field is required.")]
		public string RecipientType { get; set; }
	}
}
