import Button from "@mui/material/Button";
import Icon from "@mui/material/Icon";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";

export interface LoanItemTableEntry {
  name: string;
  price: number;
}

interface LoanItemTableProps {
  items: LoanItemTableEntry[];
  removeItem: any;
}

export function LoanItemTable(props: LoanItemTableProps) {
  return (
    <TableContainer component={Paper} sx={{ mt: 1 }}>
      <Table size="small">
        <TableBody>
          {props.items.map((i, idx) => (
            <TableRow key={i.name}>
              <TableCell>{i.name}</TableCell>
              <TableCell align="right">{i.price}€</TableCell>
              <TableCell sx={{ width: 10 }}>
                <Button onClick={() => props.removeItem(idx)}>
                  <Icon sx={{ color: "text.secondary" }}>close</Icon>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
