const Table = require('tty-table')
const chalk = require('chalk')

/**
 * Formats rows data into a terminal table.
 */
function displayTable(rows, title) {

    let style = chalk.bold.black.bgWhite;

    console.log('')

    if (rows.length === 0) {
        console.log(style(`No data for ${title}`))
        return
    }

    console.log(style(`Data for ${title}`))
    let header = [{
        value: "author",
        headerColor: "white",
        color: "red",
        align: "left",
        width: 60
      },
      {
        value: "message",
        headerColor: "white",
        color: "red",
        align: "left",
        width: 150
      }]

    const options = {
      borderStyle: "solid",
      borderColor: "black",
      paddingBottom: 0,
      headerAlign: "center",
      align: "center",
      color: "white",
      truncate: "..."
    }

    console.log(Table(header, rows, null, options).render())
    console.log('')
}

module.exports.formatTable = displayTable
