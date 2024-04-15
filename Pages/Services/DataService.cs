using CadetTest.Entities;
using CadetTest.Helpers;
using CadetTest.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CadetTest.Services
{
	public interface IDataService
	{
		string GetRandomString(int stringLength);
		void InitConsents();
		int AddConsent(ConsentAddRequest addRequest);
		bool UpdateConsent(ConsentUpdateRequest updateConsent);
		bool DeleteConsent(int id);

		List<Consent> GetRangeById(int id, int adet);
	}
	public class DataService : IDataService
	{
		private DataContext _context;
		private readonly AppSettings _appSettings;
		private readonly ILogger<UserService> _logger;
		private Random _random;

		public DataService(DataContext context, IOptions<AppSettings> appSettings, ILogger<UserService> logger)
		{
			_context = context;
			_appSettings = appSettings.Value;
			_logger = logger;

			_random = new Random();
		}

		#region Public Methods

		public List<Consent> GetRangeById(int id, int adet)
		{
			var cevap = _context.Consents.Where(k => k.Id >= id).Take(adet).ToList();
			return cevap;
		}
		#endregion


		public void InitConsents()
		{
			if (_context.Consents.Any()) return;

			for (int i = 1; i < _appSettings.ConsentCount; i++)
			{
				var consent = new Consent
				{
					Recipient = $"{GetRandomString(10)}_{i}@ornek.com",
					RecipientType = "EPOSTA",
					Status = "ONAY",
					Type = "EPOSTA"
				};

				_context.Consents.Add(consent);
			}
		}
		public int AddConsent(ConsentAddRequest newConsent)
		{
			try
			{
				int maxId = _context.Consents.Max(c => c.Id);//Uniq id belirlenmesi 				
				var consent = new Consent
				{
					Id = ++maxId,
					Recipient = newConsent.Recipient,
					RecipientType = newConsent.RecipientType,
					Status = newConsent.Status,
					Type = newConsent.Type
				};
				_context.Consents.Add(consent);
				_context.SaveChanges();

				return maxId;
			}
			catch (Exception ex)
			{
				_logger.LogError($"Error adding consent: {ex.Message}");
				return -1;
			}
		}

		public bool UpdateConsent(ConsentUpdateRequest updatedConsent)
		{
			var existingConsent = _context.Consents.FirstOrDefault(c => c.Id == updatedConsent.Id);
			if (existingConsent != null)
			{
				existingConsent.Recipient = updatedConsent.Recipient;
				existingConsent.RecipientType = updatedConsent.RecipientType;
				existingConsent.Status = updatedConsent.Status;
				existingConsent.Type = updatedConsent.Type;
				_context.SaveChanges();
				return true;
			}
			else
			{
				_logger.LogError($"Consent with ID {updatedConsent.Id} not found.");
				return false;
			}
		}
		public bool DeleteConsent(int consentId)
		{
			try
			{
				var existingConsent = _context.Consents.FirstOrDefault(c => c.Id == consentId);
				if (existingConsent != null)
				{
					_context.Remove(existingConsent);
					_context.SaveChanges();
					return true;
				}
				else
				{
					_logger.LogError($"Consent with ID {consentId} not found.");
					return false;
				}
			}
			catch (Exception ex)
			{
				_logger.LogError($"Error deleting consent with ID {consentId}: {ex.Message}");
				return false;
			}
		}




		#region Private Methods

		public string GetRandomString(int stringLength)
		{
			var sb = new StringBuilder();
			int numGuidsToConcat = (((stringLength - 1) / 32) + 1);
			for (int i = 1; i <= numGuidsToConcat; i++)
			{
				sb.Append(Guid.NewGuid().ToString("N"));
			}

			return sb.ToString(0, stringLength);
		}
		#endregion
	}
}
