
// import React from "react";
// import { Link, Outlet, useNavigate } from "react-router-dom";
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faSignOutAlt, faInfoCircle, faUser, faTasks, faStickyNote } from '@fortawesome/free-solid-svg-icons';
// import "../css/Home.css";

// const Home = () => {
//     const navigate = useNavigate();
//     const logOut = () => {
//         localStorage.clear();
//         navigate(`/login`);
//     };

//     return (
//         <>
//         <div className="top-bar">
//             <div className="links">           
//                 <Link to="todos">
//                     <FontAwesomeIcon icon={faTasks} style={{ marginRight: '5px' }} />
//                     Tasks
//                 </Link>
//                 <Link to="posts">
//                     <FontAwesomeIcon icon={faStickyNote} style={{ marginRight: '5px' }} />
//                     Posts
//                 </Link>
//             </div>
//             <div className="user-profile">
//                 <FontAwesomeIcon icon={faUser} />
//                 <p>welcom {JSON.parse(localStorage.getItem('currentUser')).username}</p>
//                 <div className="profile-buttons">
//                     <button onClick={() => navigate('info')}>
//                         <FontAwesomeIcon icon={faInfoCircle} /> 
//                     </button>
//                     <button onClick={logOut}>
//                         <FontAwesomeIcon icon={faSignOutAlt} />
//                     </button>
//                 </div>
//             </div>
//         </div>
//             <Outlet />
//         </>

//     );
// };

// export default Home;