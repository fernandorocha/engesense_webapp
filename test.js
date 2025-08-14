repl.repl.ignoreUndefined=true

const {InfluxDB, Point} = require('@influxdata/influxdb-client')

const token = process.env.INFLUXDB_TOKEN
const url = 'http://ec2-18-224-180-205.us-east-2.compute.amazonaws.com:8086'

const client = new InfluxDB({url, token})

//execute a simple query
let queryClient = client.getQueryApi(org)
let fluxQuery = `from(bucket: "homeEnergy")
 |> range(start: -10m)
 |> filter(fn: (r) => r._measurement == "home_pt")`

queryClient.queryRows(fluxQuery, {
  next: (row, tableMeta) => {
    const tableObject = tableMeta.toObject(row)
    console.log(tableObject)
  },
  error: (error) => {
    console.error('\nError', error)
  },
  complete: () => {
    console.log('\nSuccess')
  },
})
