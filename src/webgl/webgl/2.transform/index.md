
2D（齐次坐标）：

$$
T(t_x,t_y)=\begin{bmatrix}
1 & 0 & t_x\\[4pt]
0 & 1 & t_y\\[4pt]
0 & 0 & 1
\end{bmatrix}
$$

作用：
$$
T(t_x,t_y)\begin{bmatrix}x\\[4pt]y\\[4pt]1\end{bmatrix}
=
\begin{bmatrix}x+t_x\\[4pt]y+t_y\\[4pt]1\end{bmatrix}
$$

3D（齐次坐标）：

$$
T(t_x,t_y,t_z)=\begin{bmatrix}
1 & 0 & 0 & t_x\\[4pt]
0 & 1 & 0 & t_y\\[4pt]
0 & 0 & 1 & t_z\\[4pt]
0 & 0 & 0 & 1
\end{bmatrix}
$$

作用：
$$
T(t_x,t_y,t_z)\begin{bmatrix}x\\[4pt]y\\[4pt]z\\[4pt]1\end{bmatrix}
=
\begin{bmatrix}x+t_x\\[4pt]y+t_y\\[4pt]z+t_z\\[4pt]1\end{bmatrix}
$$
