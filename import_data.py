import os
import shutil
import argparse
import json

import numpy as np
from PIL import Image


def parse_args():
    parser = argparse.ArgumentParser(
        description='args for plotting')
    parser.add_argument(
        '--samples', type=int, default=10)
    parser.add_argument(
        '--input_directory', type=str, default="../train-procgen-pytorch")
    parser.add_argument(
        '--output_directory', type=str, default="./static/data")
    args = parser.parse_args()
    return args


def pca_transform(X, components, original_mu, original_sigma):
    X_scaled = (X - original_mu) / original_sigma
    return X_scaled @ components.T


def project_gradients_into_pc_space(grad_data, pca_components, original_sigma):
    sigma = np.diag(original_sigma)
    grad_data = grad_data.T  # So each column is a grad vector for a hx
    scaled_pc_comps = pca_components @ sigma  # PCs calculated on X'=(X-mu)/sigma are scaled so it's like they were calculated on X
    projected_grads = scaled_pc_comps @ grad_data  # grads are projected onto the scaled PCs
    return projected_grads.T


def sample_info_for_panel_data(sample_name, pca_components, all_hx_mu,
                               all_hx_sigma, args):
    """
    Return the data formatted for inclusion in panel_data.json
    """
    sample_path = f"{args.input_directory}/generative/recorded_informinit_gen_samples/{sample_name}"
    hx = np.load(sample_path + '/agent_hxs.npy')
    grad_hx_action = np.load(sample_path + '/grad_hx_action.npy')
    grad_hx_value = np.load(sample_path + '/grad_hx_value.npy')
    min_pc_directions = 1
    max_pc_directions = 3 + 1
    grad_hx_pcs = [np.load(sample_path + '/grad_hx_hx_direction_%i.npy' % idx)
                   for idx in range(min_pc_directions, max_pc_directions)]

    hx_loadings = pca_transform(hx, pca_components, all_hx_mu,
                                all_hx_sigma).tolist()
    # Not entirely clear what the most principled choice is, especially on if we should scale by original hx_sigma.
    grad_hx_action_loadings = project_gradients_into_pc_space(grad_hx_action,
                                                              pca_components,
                                                              all_hx_sigma).tolist()
    grad_hx_value_loadings = project_gradients_into_pc_space(grad_hx_value,
                                                             pca_components,
                                                             all_hx_sigma).tolist()

    loadings_dict = {
        "hx_loadings": hx_loadings,
        "grad_hx_value_loadings": grad_hx_value_loadings,
        "grad_hx_action_loadings": grad_hx_action_loadings,
    }

    # Now do the same iteratively for the PC direction loadings
    grad_hx_direction_loadings_dict = {}
    for idx, grads_hx_pc_direction in zip(
            range(min_pc_directions, max_pc_directions), grad_hx_pcs):
        grad_hx_direction_loadings_dict.update(
            {'grad_hx_hx_direction_%i_loadings' % idx:
                 project_gradients_into_pc_space(grads_hx_pc_direction, pca_components,
                                                 all_hx_sigma).tolist()})

    loadings_dict.update(grad_hx_direction_loadings_dict)

    return loadings_dict


def make_img_set_from_arr(path, arr):
    os.mkdir(path)
    for i in range(arr.shape[0]):
        im = Image.fromarray(arr[i], mode='RGB')
        im.save(f"{path}/{i}.png")


def save_sample_images(sample_name, args):
    sample_in = f"{args.input_directory}/generative/recorded_informinit_gen_samples/{sample_name}"
    sample_out = f"{args.output_directory}/{sample_name}"
    os.mkdir(sample_out)

    obs = np.load(sample_in + '/obs.npy')
    obs = np.moveaxis(obs, 1, 3)

    sal_action = np.load(sample_in + '/grad_processed_obs_action.npy')
    sal_value = np.load(sample_in + '/grad_processed_obs_value.npy')

    make_img_set_from_arr(f"{sample_out}/obs", obs)
    make_img_set_from_arr(f"{sample_out}/sal_action", sal_action)
    make_img_set_from_arr(f"{sample_out}/sal_value", sal_value)

    # Now do iteratively for PC direction saliency
    for idx in range(1, 4):
        sal = np.load(sample_in + '/grad_processed_obs_hx_direction_%i.npy' % idx)
        make_img_set_from_arr(f"{sample_out}/sal_hx_direction_%i" % idx, sal)


def run():
    args = parse_args()

    sample_names = [f"sample_{i:05d}" for i in range(args.samples)]

    hx_analysis_dir = f"{args.input_directory}/analysis/hx_analysis_precomp"

    n_suffix = 4000

    pca_components = np.load(f"{hx_analysis_dir}/pcomponents_{n_suffix}.npy")
    all_hx_mu = np.load(f"{hx_analysis_dir}/hx_mu_{n_suffix}.npy")
    all_hx_sigma = np.load(f"{hx_analysis_dir}/hx_std_{n_suffix}.npy")

    print(f"Output folder: {os.path.abspath(args.output_directory)}");
    print("This folder will be deleted and replaced with exported data.")

    confirm = input("Continue? y/[n]: ")
    if confirm.lower() in ["y", "yes"]:

        # Clear directory
        if os.path.exists(args.output_directory):
            shutil.rmtree(args.output_directory)
        os.mkdir(args.output_directory)

        # output panel_data.json
        hx_in_pca = np.load(f"{hx_analysis_dir}/hx_pca_{n_suffix}.npy")
        with open(args.output_directory + "/panel_data.json", 'w') as f:
            json.dump({
                "base_hx_loadings": hx_in_pca[:1000, :20].tolist(),
                "samples": {
                    sample_name: sample_info_for_panel_data(
                        sample_name,
                        pca_components,
                        all_hx_mu,
                        all_hx_sigma,
                        args)
                    for sample_name in sample_names
                }
            }, f)

        # make a folder for each sample for images 
        for sample in sample_names:
            save_sample_images(sample, args)

        print("Done!")

    else:
        print("Process cancelled!")


if __name__ == "__main__":
    run()

