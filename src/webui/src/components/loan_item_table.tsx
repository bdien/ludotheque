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
  simulatedPrice?: number;
}

interface LoanItemTableProps {
  items: LoanItemTableEntry[];
  removeItem: (idx: number) => void;
}

export function LoanItemTable(props: LoanItemTableProps) {
  return (
    <TableContainer component={Paper} sx={{ mt: 1 }}>
      <Table>
        <TableBody>
          {props.items.map((i, idx) => (
            <TableRow key={i.name}>
              <TableCell sx={{ fontSize: "1em" }}>{i.name}</TableCell>
              <TableCell sx={{ fontSize: "1em", p: 1 }} align="right">
                {i.simulatedPrice ?? i.price}€
              </TableCell>
              <TableCell sx={{ width: 48, p: 0 }}>
                <Button
                  size="small"
                  sx={{ minWidth: 48, p: 1 }}
                  onClick={() => props.removeItem(idx)}
                >
                  <Icon sx={{ color: "text.secondary", opacity: 0.7 }}>
                    clear
                  </Icon>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
