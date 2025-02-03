import React from "react";
import {
	useReactTable,
	getCoreRowModel,
	getSortedRowModel,
	SortingState,
	flexRender,
} from "@tanstack/react-table";
import { defaultColumns } from "./columns";

interface PDAlertTableProps {
	data: any[];
	columns: any[];
}

export const PDAlertTable: React.FC<PDAlertTableProps> = ({
	data,
	columns,
}) => {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	console.log(data, "haha data");
	const table = useReactTable({
		data,
		columns: columns,
		state: {
			sorting,
		},
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	return (
		<div style={{ width: "95vw", overflowX: "auto" }}>
			<table className="table table-striped" style={{ width: "100%" }}>
				<thead>
					{table.getHeaderGroups().map((headerGroup) => (
						<tr key={headerGroup.id} style={{ borderBottomColor: "#0156A8" }}>
							{headerGroup.headers.map((header) => (
								<th
									key={header.id}
									onClick={header.column.getToggleSortingHandler()}
									style={{
										cursor: "pointer",
										width: (header.column.columnDef as any).width,
										fontSize: "14px",
										fontWeight: 700,
										lineHeight: "17.6px",
										color: "#000000",
									}}
								>
									{flexRender(
										header.column.columnDef.header,
										header.getContext()
									)}
									{/* {{
									asc: " 🔼",
									desc: " 🔽",
								}[header.column.getIsSorted() as string] ?? null} */}
								</th>
							))}
						</tr>
					))}
				</thead>
				<tbody>
					{table.getRowModel().rows.map((row) => {
						console.log("row : ", row);
						return (
							<tr key={row.id}>
								{row.getVisibleCells().map((cell) => (
									<td
										key={cell.id}
										style={{
											padding: "8px",
											paddingBottom: "28px",
											fontSize: "14px",
											fontWeight: 400,
										}}
									>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</td>
								))}
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
};
