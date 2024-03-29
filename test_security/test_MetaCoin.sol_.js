const assert = require('assert')
const Runner = require('truffle-sca2t-mythx').Runner
const Report = require('truffle-sca2t-mythx').Report

describe('MetaCoin.sol', () => {
  let runner;
  let compiledResults;
  let dataArrForAPI;
  let analyzedResult;

  before(async () => {
    const contractFile = 'MetaCoin.sol'

    // instanciate Runner
    runner = new Runner(contractFile)

    // compile
    compiledResults = await runner.doCompile()

    // generate data which is sent to MythX
    dataArrForAPI = await runner.generateDataForAPI(compiledResults)

    // Login to MythX before analyzing
    await runner.login()

    // Analyze
    analyzedResult = await runner.doAnalyzes(dataArrForAPI)
  })


  describe('MetaCoin', () => {
    let index;
    let report;
    before(async () => {
      for (index = 0; index < dataArrForAPI.length; index++) {
        if (dataArrForAPI[index].contractName === 'MetaCoin') break;
      }

      // instanciate Report with data which was sent to MythX
      report = new Report(dataArrForAPI[index])
    })

    it('should be no error', async (done) => {
      if (analyzedResult[index].error) {
        let errStr = report.convertErrToStr(analyzedResult[index].error)

        if (errStr.includes('User or default timeout reached after') || errStr.includes('Timeout reached after')) {
          // if timeout, fails and shows UUID        
          done(new Error(`
  ${errStr}
Retrive the result with the above UUID later or try again.
          `))
        } else {
          done(new Error(`
MythX Error: ${errStr}
Data which was sent to MythX:
${JSON.stringify(dataArrForAPI[index], null, 2)}
`))
        }
      } else {
        done();
      }
    })

    it('should be no MythX log', async () => {
      assert(!analyzedResult[index].error, 'API returned Error')

      const logs = report.getMythXLogs(analyzedResult[index].issues[0])

      assert.equal(logs.length, 0, `
Mythx Logs:
${JSON.stringify(logs, null, 2)}

Data which was sent to MythX:
${JSON.stringify(dataArrForAPI[index], null, 2)}

UUID: ${analyzedResult[index].status.uuid}`)
    })

    it('should be no issue', async () => {
      assert(!analyzedResult[index].error, 'API returned Error')
      assert(analyzedResult[index].issues[0].issues, `issues is not set.`)
      const jsonIssues = report.getJsonIssues(analyzedResult[index].issues[0])
      assert.equal(jsonIssues.length, 0, `

=========== Vulnerability Report ================
${jsonIssues.length} vulnerabilities were found.

Vulnerabilities:
${report.getReport(jsonIssues)}

UUID: ${analyzedResult[index].status.uuid}
=================================================

`)
    })
  })

 
})
