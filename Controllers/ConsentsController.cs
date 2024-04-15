using CadetTest.Entities;
using CadetTest.Models;
using CadetTest.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CadetTest.Controllers
{
   
    [Route("api/[controller]")]
	//[Authorize]
	[ApiController]
    public class ConsentsController : ControllerBase
    {
        private ILogger<ConsentsController> _logger;
        private AppSettings _appSettings;
        private IDataService _dataService;
        private readonly JsonSerializerSettings _jsonSettings;

        public ConsentsController(ILogger<ConsentsController> logger, IOptions<AppSettings> appSettings, IDataService dataService)
        {
            _logger = logger;
            _appSettings = appSettings.Value;
            _dataService = dataService;
            _jsonSettings = new JsonSerializerSettings { ContractResolver = new CamelCasePropertyNamesContractResolver() };
        }		
		[HttpPost]
        public IActionResult Post(ConsentRequest request)
        {
            var cevap = _dataService.GetRangeById(request.StartId, request.Count);
            return Ok(cevap);
        }
		[HttpPost("Add")]
		public IActionResult Add(ConsentAddRequest request)
		{
			var cevap = _dataService.AddConsent(request);
			return Ok(cevap);
		}
		[HttpPut("Update")]
		public IActionResult Update(ConsentUpdateRequest request)
		{
            var response = _dataService.UpdateConsent(request);
			return Ok(response);
		}
		[HttpDelete("Delete")]
		public IActionResult Delete([FromQuery]int id)
		{
			var response = _dataService.DeleteConsent(id);
			return Ok(response);
		}
	}
}
