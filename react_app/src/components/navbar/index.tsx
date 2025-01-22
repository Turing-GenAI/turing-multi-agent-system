import React, { useEffect, useState } from "react";
const NavBar = ({
	useCase,
	selectUseCase,
}: {
	useCase: number;
	selectUseCase: (selectedCase: number) => void;
}) => {
	const [accountType, setAccountType] = useState<number>(0);
	const [dayGreet, setDayGreet] = useState<string>("");
	const [selectedTrial, setSelectedTrial] = useState<string>(
		"Trial 90014496LYM1001"
	);

	useEffect(() => {
		const storedUserData = localStorage.getItem("userData");
		const userData = JSON.parse(storedUserData || "{}");

		if (userData?.account_type) {
			setAccountType(userData?.account_type);
		}

		setDayGreet(getGreeting());
	});

	function getGreeting(): string {
		// Get the current hour of the day
		const today = new Date();
		const hour = today.getHours(); // Returns a number from 0 (midnight) to 23 (11 PM)
		// Determine the appropriate greeting based on the hour
		let greeting: string;
		if (hour >= 0 && hour < 5) {
			greeting = "Hi,";
		} else if (hour > 4 && hour < 12) {
			greeting = "Good morning!";
		} else if (hour < 18) {
			greeting = "Good day!";
		} else {
			greeting = "Good evening!";
		}

		return greeting;
	}

	const userData = JSON.parse(localStorage.getItem("userData") || "{}");

	return (
		<header className="main-header">
			<div className="container-fluid">
				<nav className="navbar navbar-expand-lg">
					<div className="container-fluid">
						<a className="" href="./">
							<div className="">
								<div>
									<img src="./turing-logo-new.jpg" width={104} />
									<div
										style={{
											position: "absolute",
											left: "26px",
											bottom: "10px",
											fontSize: "14px",
											fontWeight: 400,
											color: "black",
										}}
									>
										Audit Copilot
									</div>
								</div>
								<div></div>
							</div>
						</a>
						<ul className="navbar-nav me-auto ms-md-5">
							<li className="nav-item">
								<div className="dropdown ">
									{/* <a
										className="btn btn-light dropdown-toggle rounded dropdownSelect"
										href="#"
										role="button"
										data-bs-toggle="dropdown"
										aria-expanded="false"
									>
										<span className="d-none d-sm-inline-block">
											{selectedTrial}
										</span>
									</a>
									<ul className="dropdown-menu">
										<li
											className="dropdown-item"
											onClick={() => setSelectedTrial("Trial 90014496LYM1001")}
										>
											{"Trial 90014496LYM1001"}
											{""}
										</li>
										<li
											className="dropdown-item"
											onClick={() => setSelectedTrial("Trial 80014496LYM1551")}
										>
											Trial 80014496LYM1551
										</li>
										<li
											className="dropdown-item"
											onClick={() => setSelectedTrial("Trial 50014496LYM9893")}
										>
											Trial 50014496LYM9893
										</li>
									</ul> */}
								</div>
							</li>
						</ul>
						<div className="d-flex justify-content-end">
							<div className="dropdown ">
								{/* <a
									className="btn btn-light dropdown-toggle rounded dropdownSelect"
									href="#"
									role="button"
									data-bs-toggle="dropdown"
									aria-expanded="false"
								>
									<i className="bi bi-person"></i>
									<span className="d-none d-sm-inline-block">
										&nbsp; Hey, Tracy
									</span>
								</a>
								<ul className="dropdown-menu dropdown-menu-end">
									<li className="dropdown-item">
										<i className="bi bi-lock"></i> Log out
									</li>
								</ul> */}
							</div>
						</div>
					</div>
				</nav>
			</div>
		</header>
	);
};

export default NavBar;
