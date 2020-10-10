let Table = require('tty-table')

/**
 * Formats rows data into a terminal table.
 */
function formatTable(rows) {

    let header = [{
        value: "author",
        headerColor: "white",
        color: "red",
        align: "left",
        width: 40
      },
      {
        value: "message",
        headerColor: "white",
        color: "red",
        align: "left",
        width: 40
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

    return Table(header, rows, null, options).render()
}

module.exports.formatTable = formatTable
